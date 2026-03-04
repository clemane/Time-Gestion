# Partner Sharing — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow two users to link accounts as partners and share calendars, notes groups, recipes, meal plans, and shopping lists.

**Architecture:** Add a Partner relationship on User model. Partner invites use 6-digit codes with 15-min expiry. Once linked, the sync service includes partner data for shared resources (recipes, meal plan, shopping) and shared calendars/groups.

**Tech Stack:** Prisma (PostgreSQL), NestJS, Vue 3 + Pinia, Dexie (IndexedDB)

---

## Task 1: Add Partner models to Prisma schema

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

**Steps:**

1. Add `PartnerInvite` model:
```prisma
model PartnerInvite {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  code      String   @unique @db.VarChar(6)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("partner_invites")
}
```

2. Add partner relationship to User model:
```prisma
// Add to User model:
partnerId       String?  @unique @map("partner_id") @db.Uuid
partner         User?    @relation("PartnerLink", fields: [partnerId], references: [id])
partnerOf       User?    @relation("PartnerLink")
partnerInvites  PartnerInvite[]
```

3. Run: `npx prisma migrate dev --name add_partner_system`

4. Commit: `feat(db): add partner invite and partner link models`

---

## Task 2: Create Partner backend module

**Files:**
- Create: `apps/backend/src/partner/partner.module.ts`
- Create: `apps/backend/src/partner/partner.controller.ts`
- Create: `apps/backend/src/partner/partner.service.ts`
- Create: `apps/backend/src/partner/dto/join-partner.dto.ts`
- Modify: `apps/backend/src/app.module.ts` (import PartnerModule)

**Partner Service:**
```typescript
@Injectable()
export class PartnerService {
  constructor(private prisma: PrismaService) {}

  async generateInvite(userId: string) {
    // Delete old invites for this user
    await this.prisma.partnerInvite.deleteMany({ where: { userId } });

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    return this.prisma.partnerInvite.create({
      data: { userId, code, expiresAt },
    });
  }

  async joinPartner(userId: string, code: string) {
    const invite = await this.prisma.partnerInvite.findUnique({ where: { code } });

    if (!invite) throw new NotFoundException('Code invalide');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Code expiré');
    if (invite.userId === userId) throw new BadRequestException('Vous ne pouvez pas vous inviter vous-même');

    // Link both users
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { partnerId: invite.userId } }),
      this.prisma.user.update({ where: { id: invite.userId }, data: { partnerId: userId } }),
      this.prisma.partnerInvite.delete({ where: { id: invite.id } }),
    ]);

    return { partnerId: invite.userId };
  }

  async getPartner(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partner: { select: { id: true, displayName: true, email: true } } },
    });
    return user?.partner || null;
  }

  async unlinkPartner(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.partnerId) throw new BadRequestException('Pas de partenaire');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { partnerId: null } }),
      this.prisma.user.update({ where: { id: user.partnerId }, data: { partnerId: null } }),
    ]);
  }
}
```

**Controller endpoints:**
- `POST /api/partner/invite` → generateInvite (returns { code, expiresAt })
- `POST /api/partner/join` → joinPartner (body: { code })
- `GET /api/partner` → getPartner (returns partner info or null)
- `DELETE /api/partner` → unlinkPartner

Commit: `feat(backend): add partner invitation and linking system`

---

## Task 3: Update Sync to include partner data

**Files:**
- Modify: `apps/backend/src/sync/sync.service.ts`

**Changes to `pullChanges`:**

1. Get the user's partnerId
2. For shared calendars: find Share records between partners, include partner's calendar events and notes for those calendars
3. For recipes, mealSlots, shoppingItems: always include partner's data

```typescript
async pullChanges(userId: string, since: string) {
  const sinceDate = new Date(since);
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  const partnerId = user?.partnerId;

  // User IDs to include for auto-shared resources
  const autoShareUserIds = partnerId ? [userId, partnerId] : [userId];

  // Shared calendar IDs (from Share model between partners)
  const sharedCalendarIds = partnerId ? await this.getSharedCalendarIds(userId, partnerId) : [];

  const [folders, categories, notes, calendars, events, shares, recipes, recipeIngredients, mealSlots, shoppingItems] =
    await Promise.all([
      // Personal only
      this.prisma.folder.findMany({ where: { userId, updatedAt: { gt: sinceDate } } }),
      this.prisma.category.findMany({ where: { userId, updatedAt: { gt: sinceDate } } }),
      // Notes: personal + from shared calendars
      this.prisma.note.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          OR: [
            { userId },
            { calendarId: { in: sharedCalendarIds } },
          ],
        },
      }),
      // Calendars: personal + shared
      this.prisma.calendar.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          OR: [
            { userId },
            { id: { in: sharedCalendarIds } },
          ],
        },
      }),
      // Events: personal + from shared calendars
      this.prisma.calendarEvent.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          OR: [
            { userId },
            { calendarId: { in: sharedCalendarIds } },
          ],
        },
      }),
      this.prisma.share.findMany({
        where: { OR: [{ ownerId: userId }, { sharedWithId: userId }], createdAt: { gt: sinceDate } },
      }),
      // Auto-shared with partner
      this.prisma.recipe.findMany({ where: { userId: { in: autoShareUserIds }, updatedAt: { gt: sinceDate } } }),
      this.prisma.recipeIngredient.findMany({
        where: { recipe: { userId: { in: autoShareUserIds } } },
      }),
      this.prisma.mealSlot.findMany({ where: { userId: { in: autoShareUserIds }, updatedAt: { gt: sinceDate } } }),
      this.prisma.shoppingItem.findMany({ where: { userId: { in: autoShareUserIds }, createdAt: { gt: sinceDate } } }),
    ]);

  return {
    changes: [
      ...folders.map(f => ({ entity: 'folder' as const, data: f })),
      ...categories.map(c => ({ entity: 'category' as const, data: c })),
      ...notes.map(n => ({ entity: 'note' as const, data: n })),
      ...calendars.map(c => ({ entity: 'calendar' as const, data: c })),
      ...events.map(e => ({ entity: 'calendarEvent' as const, data: e })),
      ...shares.map(s => ({ entity: 'share' as const, data: s })),
      ...recipes.map(r => ({ entity: 'recipe' as const, data: r })),
      ...recipeIngredients.map(ri => ({ entity: 'recipeIngredient' as const, data: ri })),
      ...mealSlots.map(ms => ({ entity: 'mealSlot' as const, data: ms })),
      ...shoppingItems.map(si => ({ entity: 'shoppingItem' as const, data: si })),
    ],
    serverTime: new Date().toISOString(),
  };
}

private async getSharedCalendarIds(userId: string, partnerId: string): Promise<string[]> {
  const shares = await this.prisma.share.findMany({
    where: {
      resourceType: 'CALENDAR',
      OR: [
        { ownerId: userId, sharedWithId: partnerId },
        { ownerId: partnerId, sharedWithId: userId },
      ],
    },
  });
  return shares.map(s => s.resourceId);
}
```

Also update `pushChanges` to allow partner to edit shared resources (recipes, mealSlots, shoppingItems, shared calendar events).

Commit: `feat(sync): include partner data in sync pull for shared resources`

---

## Task 4: Update Sync push to allow partner edits

**Files:**
- Modify: `apps/backend/src/sync/sync.service.ts`

**Changes to `applyOperation` and `getModel`:**

Add recipe, recipeIngredient, mealSlot, shoppingItem to the getModel switch. For UPDATE/DELETE, expand ownership check to include partner:

```typescript
// In applyOperation, for UPDATE/DELETE:
const user = await this.prisma.user.findUnique({ where: { id: userId } });
const ownerIds = user?.partnerId ? [userId, user.partnerId] : [userId];

const existing = await (model as any).findFirst({
  where: { id: op.entityId, userId: { in: ownerIds } },
});
```

Commit: `feat(sync): allow partner to push edits on shared resources`

---

## Task 5: Add partner UI in Settings

**Files:**
- Modify: `apps/frontend/src/views/SettingsView.vue`

**Add a "Partenaire" section** between "Gestion" and "Partages recus":

1. If no partner: show two buttons "Inviter un partenaire" and "Rejoindre un partenaire"
2. "Inviter" → calls `POST /api/partner/invite` → shows the 6-digit code with a countdown timer
3. "Rejoindre" → shows input for 6-digit code → calls `POST /api/partner/join`
4. If partner linked: show partner name/email + "Dissocier" button
5. When linked, show a share toggle on each calendar row (toggle calls createShare/removeShare)

**Add to script:**
```typescript
const partner = ref<{ id: string; displayName: string; email: string } | null>(null);
const inviteCode = ref<string | null>(null);
const inviteExpiry = ref<Date | null>(null);
const showJoinInput = ref(false);
const joinCode = ref('');

async function loadPartner() {
  try {
    partner.value = await apiFetch('/partner');
  } catch { partner.value = null; }
}

async function generateInvite() {
  const res = await apiFetch<{ code: string; expiresAt: string }>('/partner/invite', { method: 'POST' });
  inviteCode.value = res.code;
  inviteExpiry.value = new Date(res.expiresAt);
}

async function joinPartner() {
  await apiFetch('/partner/join', { method: 'POST', body: JSON.stringify({ code: joinCode.value }) });
  await loadPartner();
  joinCode.value = '';
  showJoinInput.value = false;
}

async function unlinkPartner() {
  await apiFetch('/partner', { method: 'DELETE' });
  partner.value = null;
}
```

**Calendar row — add share toggle when partner is linked:**
```vue
<button v-if="partner" class="cal-action-btn" @click="toggleShareCalendar(cal)" :title="isShared(cal.id) ? 'Ne plus partager' : 'Partager'">
  <Users :size="16" :class="{ 'text-primary': isShared(cal.id) }" />
</button>
```

Commit: `feat(ui): add partner invitation and calendar sharing in settings`

---

## Task 6: Add share toggle logic for calendars

**Files:**
- Modify: `apps/frontend/src/views/SettingsView.vue`
- Modify: `apps/frontend/src/stores/shares.ts`

**In SettingsView:**
```typescript
const sharedCalendarIds = computed(() => {
  return sharesStore.sharedWithMe
    .filter(s => s.resourceType === 'CALENDAR')
    .map(s => s.resourceId);
});

function isShared(calendarId: string): boolean {
  return sharedCalendarIds.value.includes(calendarId);
}

async function toggleShareCalendar(cal: Calendar) {
  if (!partner.value) return;

  if (isShared(cal.id)) {
    const share = sharesStore.sharedWithMe.find(s => s.resourceType === 'CALENDAR' && s.resourceId === cal.id);
    if (share) await sharesStore.removeShare(share.id);
  } else {
    await sharesStore.createShare({
      resourceType: 'CALENDAR',
      resourceId: cal.id,
      sharedWithEmail: partner.value.email,
      permission: 'WRITE',
    });
  }
  await sharesStore.loadSharedWithMe();
}
```

Commit: `feat(ui): toggle calendar sharing with partner`

---

## Task 7: Include auth user info in token/store

**Files:**
- Modify: `apps/frontend/src/stores/auth.ts` (ensure partner info is available)
- Modify: `apps/backend/src/auth/auth.service.ts` (include partnerId in JWT or user response)

The auth store needs to expose the user's partnerId so the frontend knows if a partner is linked. Modify the `/auth/me` or token refresh response to include `partnerId`.

Commit: `feat(auth): include partnerId in user profile response`

---

## Task 8: Verify and build

**Steps:**
1. Run `npx vue-tsc --noEmit` — expect 0 errors
2. Run `npx vite build` — expect success
3. Test manually: generate invite code, join, verify partner shows in settings
4. Test: share a calendar, verify partner sees events
5. Test: create recipe, verify partner sees it

Commit: `chore: verify partner sharing feature`
