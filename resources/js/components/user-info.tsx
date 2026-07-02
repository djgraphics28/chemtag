import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showUsername = false,
}: {
    user: User;
    showUsername?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar_path ?? undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary/20 text-primary dark:bg-primary/30">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showUsername && (
                    <span className="truncate text-xs text-muted-foreground">
                        @{user.username}
                    </span>
                )}
            </div>
        </>
    );
}
