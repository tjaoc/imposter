## 2026-02-04 - Multi-layered Security Improvements: ReDoS, Memory Leak, and Security Headers

**Vulnerability:** Identified ReDoS vulnerabilities where user-provided `locale` strings were passed directly into `new RegExp()`. Found a memory leak where game state and timers were not cleared after rooms were deleted.
**Learning:** The ReDoS risk existed because user input was used to build a regex prefix match without validation. The memory leak occurred because the application only deleted the room from the `rooms` Map but neglected associated state in `games`, `roomClueTimers`, and `roomVotingTimers`.
**Prevention:** Always validate user input before using it in a `RegExp` constructor, or use non-regex alternatives for prefix matching. Implement a centralized `cleanup` function for resource management (Maps, Timers) when a session or room is terminated. Use `helmet` by default to ensure basic security headers are present.
