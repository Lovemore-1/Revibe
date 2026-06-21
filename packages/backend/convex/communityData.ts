export const communityData = [
  {
    slug: "acl",
    name: "ACL Warriors",
    description: "Recovering from ACL surgery or injury. Share milestones, setbacks, and tips.",
    memberLabel: "Warrior",
    accent: "#FF6B6B",
    icon: "🦵",
  },
  {
    slug: "shoulder",
    name: "Shoulder Rehab",
    description: "Rotator cuff, labrum, and shoulder recovery support.",
    memberLabel: "Member",
    accent: "#4ECDC4",
    icon: "💪",
  },
  {
    slug: "back",
    name: "Back Strong",
    description: "Spinal injuries, disc issues, and chronic back pain recovery.",
    memberLabel: "Member",
    accent: "#45B7D1",
    icon: "🏃",
  },
  {
    slug: "surgery",
    name: "Post-Surgery",
    description: "General post-surgical recovery — all types welcome.",
    memberLabel: "Survivor",
    accent: "#96CEB4",
    icon: "🏥",
  },
  {
    slug: "mental",
    name: "Mind & Recovery",
    description: "Mental health, motivation, and emotional wellness during physical rehab.",
    memberLabel: "Member",
    accent: "#DDA0DD",
    icon: "🧠",
  },
  {
    slug: "rehab",
    name: "Daily Rehab",
    description: "General physical therapy and everyday rehabilitation wins.",
    memberLabel: "Member",
    accent: "#F7DC6F",
    icon: "⚡",
  },
] as const;

export type CommunitySlug = (typeof communityData)[number]["slug"];
