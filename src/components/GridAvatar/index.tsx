import { AvatarImg } from '@/components/CachedImg';
interface Member {
  nickname: string;
  avatar: string;
}

interface Props {
  name: string;
  members?: Member[];
  className?: string;
}

/** 群头像：2×2 成员头像拼图；无成员数据时退化为字母块 */
export function GridAvatar({ name, members, className = 'w-10 h-10' }: Props) {
  const four = (members ?? []).slice(0, 4);
  if (four.length === 0) {
    return (
      <div className={`${className} rounded-md bg-primary/15 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden`}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className={`${className} rounded-md overflow-hidden grid grid-cols-2 flex-shrink-0`}>
      {four.map((m, i) => (
        <div key={i} className="bg-primary/10 flex items-center justify-center text-[9px] text-primary overflow-hidden">
          <AvatarImg url={m.avatar} name={m.nickname} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}
