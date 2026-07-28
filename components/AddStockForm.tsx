'use client';

import { useRef } from 'react';
import { addStock } from '@/app/actions/stocks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'

export function AddStockForm() {
    const formRef = useRef<HTMLFormElement>(null)

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await addStock(formData)
                formRef.current?.reset();
            }}
            className='flex gap-2 mb-4'
        >
            <Input
                type='text'
                name="ticker"
                placeholder="Ticker"
                required
                className="flex-1"
            />
            <Input
                type='text'
                name="name"
                placeholder="Company name"
                required
                className="flex-1"
            />
            <Button type="submit">Add</Button>
        </form>
    );
}