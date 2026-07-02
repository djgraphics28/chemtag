import { Head } from '@inertiajs/react';

export default function VerifyEmail() {
    return (
        <>
            <Head title="Email verification" />
            <p className="text-center text-sm text-muted-foreground">Email verification is not enabled.</p>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
