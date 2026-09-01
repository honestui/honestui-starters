import { Head } from '@inertiajs/react';
import { StarterHome } from '@/honestui/components/starter-home';

export default function Welcome() {
    return (
        <>
            <Head title="HonestUI Laravel Starter" />
            <StarterHome
                framework="Laravel + React"
                command="composer run dev"
            />
        </>
    );
}
