/**
 * Recovery plans — entered by the user from their own physio/surgeon's
 * instructions. The app structures and tracks the plan; it never generates
 * medical advice.
 */
import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";
import {
  recoveryPlanPhaseValidator,
  recoveryPlanValidator,
} from "./model";

const MAX_TITLE = 100;
const MAX_SOURCE = 100;
const MAX_NOTES = 1000;
const MAX_PHASES = 12;
const MAX_TASKS_PER_PHASE = 30;
const MAX_LABEL = 200;

export const getMine = authQuery({
  args: {},
  returns: v.union(recoveryPlanValidator, v.null()),
  handler: async (ctx) => {
    return await ctx.db
      .query("recoveryPlans")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
  },
});

export const savePlan = authMutation({
  args: {
    title: v.string(),
    source: v.string(),
    notes: v.string(),
    phases: v.array(recoveryPlanPhaseValidator),
  },
  returns: v.id("recoveryPlans"),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (title.length === 0) throw new Error("Give your plan a title");
    if (title.length > MAX_TITLE) throw new Error("Title is too long");
    if (args.source.length > MAX_SOURCE) throw new Error("Source is too long");
    if (args.notes.length > MAX_NOTES) throw new Error("Notes are too long");
    if (args.phases.length === 0) throw new Error("Add at least one phase");
    if (args.phases.length > MAX_PHASES)
      throw new Error(`A plan can have at most ${MAX_PHASES} phases`);

    const phases = args.phases.map((phase) => {
      const name = phase.name.trim();
      if (name.length === 0) throw new Error("Every phase needs a name");
      if (name.length > MAX_LABEL) throw new Error("Phase name is too long");
      if (phase.tasks.length > MAX_TASKS_PER_PHASE)
        throw new Error(`A phase can have at most ${MAX_TASKS_PER_PHASE} tasks`);
      return {
        name,
        tasks: phase.tasks
          .filter((t) => t.label.trim().length > 0)
          .map((t) => ({
            id: t.id,
            label: t.label.trim().slice(0, MAX_LABEL),
            done: t.done,
          })),
      };
    });

    const now = Date.now();
    const existing = await ctx.db
      .query("recoveryPlans")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title,
        source: args.source.trim(),
        notes: args.notes.trim(),
        phases,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("recoveryPlans", {
      userId: ctx.user._id,
      title,
      source: args.source.trim(),
      notes: args.notes.trim(),
      phases,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleTask = authMutation({
  args: {
    taskId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("recoveryPlans")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (!plan) throw new Error("No recovery plan found");

    let found = false;
    let newDone = false;
    const phases = plan.phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map((task) => {
        if (task.id !== args.taskId) return task;
        found = true;
        newDone = !task.done;
        return { ...task, done: newDone };
      }),
    }));
    if (!found) throw new Error("Task not found");

    await ctx.db.patch(plan._id, { phases, updatedAt: Date.now() });
    return newDone;
  },
});

export const deletePlan = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const plan = await ctx.db
      .query("recoveryPlans")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (plan) await ctx.db.delete(plan._id);
    return null;
  },
});
