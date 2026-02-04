# Bolt's Journal - Imposter Performance

## 2025-05-14 - Optimized Room Cleanup and DB Queries
**Learning:** Found that `games` Map and timers were leaking memory by never being cleared when rooms were destroyed. Also identified that random pack selection was fetching all packs into memory before sampling in JS.
**Action:** Implemented `deleteRoomData` triggered by room emptiness. Switched to MongoDB `$sample` aggregation for O(1) random selection and used field projection for ID-only fetches.
