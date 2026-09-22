import { create } from 'zustand';
import { GroupInfo, GroupMember } from '@/sdk/types';
import { sameOriginMediaUrl } from '@/utils/mediaUrl';

interface GroupState {
  groups: Record<string, GroupInfo>;
  groupMembers: Record<string, GroupMember[]>;
  groupLastReadSeq: Record<string, number>;
  /** 已被移出的群：保留会话与历史消息，但聊天窗只读 */
  removedGroups: Record<string, boolean>;
  /** 群列表是否已从服务端加载过（用于判断会话里的群是否仍在自己的群列表里） */
  groupsLoaded: boolean;

  setGroups: (groups: GroupInfo[]) => void;
  addGroup: (group: GroupInfo) => void;
  /** 就地更新群信息（如 INFO_UPDATED 推送的群名），群不存在时忽略 */
  updateGroup: (groupId: string, patch: Partial<GroupInfo>) => void;
  removeGroup: (groupId: string) => void;
  markRemoved: (groupId: string) => void;
  clearRemoved: (groupId: string) => void;
  setMembers: (groupId: string, members: GroupMember[]) => void;
  addMember: (groupId: string, member: GroupMember) => void;
  removeMember: (groupId: string, userId: string) => void;
  updateLastReadSeq: (groupId: string, seq: number) => void;
  getLastReadSeq: (groupId: string) => number;
  clearAll: () => void;
}

export const useGroupStore = create<GroupState>()((set, get) => ({
  groups: {},
  groupMembers: {},
  groupLastReadSeq: {},
  removedGroups: {},
  groupsLoaded: false,

  setGroups: (rawGroups) => {
    // 群头像 URL 同源改写（http presigned → /minio 代理）
    const groups = rawGroups.map((g) => ({ ...g, avatar: sameOriginMediaUrl(g.avatar) }));
    const map: Record<string, GroupInfo> = {};
    for (const g of groups) map[g.groupId] = g;
    // 群列表来自服务端，说明仍在这些群里，移出标记整体失效
    set({ groups: map, removedGroups: {}, groupsLoaded: true });
  },

  addGroup: (group) => {
    set((s) => {
      const removed = { ...s.removedGroups };
      delete removed[group.groupId];
      return { groups: { ...s.groups, [group.groupId]: group }, removedGroups: removed };
    });
  },

  updateGroup: (groupId, patch) => {
    set((s) => {
      const cur = s.groups[groupId];
      if (!cur) return s;
      return { groups: { ...s.groups, [groupId]: { ...cur, ...patch } } };
    });
  },

  removeGroup: (groupId) => {
    set((s) => {
      const groups = { ...s.groups };
      delete groups[groupId];
      const members = { ...s.groupMembers };
      delete members[groupId];
      const seq = { ...s.groupLastReadSeq };
      delete seq[groupId];
      return { groups, groupMembers: members, groupLastReadSeq: seq };
    });
  },

  markRemoved: (groupId) => {
    set((s) => ({ removedGroups: { ...s.removedGroups, [groupId]: true } }));
  },

  clearRemoved: (groupId) => {
    set((s) => {
      const removed = { ...s.removedGroups };
      delete removed[groupId];
      return { removedGroups: removed };
    });
  },

  setMembers: (groupId, rawMembers) => {
    // 成员头像 URL 同源改写（http presigned → /minio 代理）
    const members = rawMembers.map((m) => ({ ...m, avatar: sameOriginMediaUrl(m.avatar) }));
    set((s) => ({ groupMembers: { ...s.groupMembers, [groupId]: members } }));
  },

  addMember: (groupId, member) => {
    set((s) => {
      const existing = s.groupMembers[groupId] || [];
      if (existing.some((m) => m.userId === member.userId)) return s;
      return { groupMembers: { ...s.groupMembers, [groupId]: [...existing, member] } };
    });
  },

  removeMember: (groupId, userId) => {
    set((s) => {
      const existing = s.groupMembers[groupId] || [];
      return {
        groupMembers: {
          ...s.groupMembers,
          [groupId]: existing.filter((m) => m.userId !== userId),
        },
      };
    });
  },

  updateLastReadSeq: (groupId, seq) => {
    set((s) => ({
      groupLastReadSeq: {
        ...s.groupLastReadSeq,
        [groupId]: Math.max(s.groupLastReadSeq[groupId] || 0, seq),
      },
    }));
  },

  getLastReadSeq: (groupId) => get().groupLastReadSeq[groupId] || 0,

  clearAll: () => set({ groups: {}, groupMembers: {}, groupLastReadSeq: {}, removedGroups: {}, groupsLoaded: false }),
}));
