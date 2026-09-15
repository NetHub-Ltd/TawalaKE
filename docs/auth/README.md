# Ecosystem auth program (Tawala)

**Status:** M0 complete (contracts & docs). Implementation starts at M1.  
**Board:** https://github.com/orgs/NetHub-Ltd/projects/3  
**Umbrella:** https://github.com/NetHub-Ltd/TawalaKE/issues/238  

| Doc | Issue | Purpose |
|-----|-------|---------|
| [sequences.md](./sequences.md) | #220 | Owner, shared terminal, PIN switch, logout flows |
| [token-claims.md](./token-claims.md) | #221 | Hard-session JWT claim contract (NetHubKe ↔ Tawala) |
| [threat-model-pin.md](./threat-model-pin.md) | #222 | PIN soft session & shared-device threats |

**End state:** Keycloak (IdP) → NetHubKe (AS) → Tawala hard session + PIN soft session. Staff only in Tawala. No per-request hop to NetHub on POS paths. Legacy staff password login remains until M9 + explicit approval.

**Flags (all default off except legacy login on):**  
`AUTH_HARD_SESSION_V2` · `AUTH_PIN_SOFT_SESSION` · `AUTH_DUAL_GATE_WRITES` · `AUTH_NETHUB_EXCHANGE` · `AUTH_LEGACY_STAFF_LOGIN` (on until M9)
