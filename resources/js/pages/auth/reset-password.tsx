import { Head } from '@inertiajs/react';

export default function ResetPassword() {
    return (
        <>
            <Head title="Reset password" />
            <p className="text-center text-sm text-muted-foreground">Password reset is not available.</p>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Password reset via email is not enabled.',
};
