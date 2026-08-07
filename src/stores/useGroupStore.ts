import { create } from 'zustand';
import { GroupInfo, GroupMember } from '@/sdk/types';

interface GroupState {
  groups: Record<string, GroupInfo>;
  groupMembers: Record<string, GroupMember[]>;
  groupLastReadSeq: Record<string, number>;

  setGroups: (groups: GroupInfo[]) => void;
  addGroup: (group: GroupInfo) => void;
  removeGroup: (groupId: string) => void;
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

  setGroups: (groups) => {
    const map: Record<string, GroupInfo> = {};
    for (const g of groups) map[g.groupId] = g;
    set({ groups: map });
  },

  addGroup: (group) => {
    set((s) => ({ groups: { ...s.groups, [group.groupId]: group } }));
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

  setMembers: (groupId, members) => {
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

  clearAll: () => set({ groups: {}, groupMembers: {}, groupLastReadSeq: {} }),
}));
