import { Head } from '@inertiajs/react';

export default function ForgotPassword() {
    return (
        <>
            <Head title="Forgot password" />
            <p className="text-center text-sm text-muted-foreground">Password reset is not available.</p>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Password reset via email is not enabled.',
};
