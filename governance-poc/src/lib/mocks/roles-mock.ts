// MOCK: Replace with fetch('/api/roles') once teammate pushes their code
// To migrate: delete this file, update getRoles() in meeting-agent.ts to use real endpoint

export const MOCK_ROLES = [
  { id: "mock-1", name: "Alice Chen", designation: "CEO", department: "Leadership" },
  { id: "mock-2", name: "Bob Kumar", designation: "CFO", department: "Finance" },
  { id: "mock-3", name: "Carol Osei", designation: "COO", department: "Operations" },
  { id: "mock-4", name: "David Park", designation: "Regional MD", department: "Operations" },
  { id: "mock-5", name: "Emma Torres", designation: "Regional Finance Manager", department: "Finance" },
];

export async function getRoles() {
  // SWITCH: When teammate pushes /api/roles, replace this block with:
  // const res = await fetch('/api/roles')
  // return res.json()
  return MOCK_ROLES;
}
