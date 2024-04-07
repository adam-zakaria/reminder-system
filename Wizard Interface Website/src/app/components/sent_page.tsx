'use client';
import React from 'react';
import Button from 'react-bootstrap/Button';

export function SendingPage({msgs = "unknown error"}) {
    return (
        <div>
            <h1>Sending ...</h1>
        </div>
    )
}


export function SentPage({msgs = "unknown error", returnFunc = () => {}}) {
    return (
        <div>
            <h1>Sent!</h1>
            <Button onClick={returnFunc}>Go Back</Button>
        </div>
    )
}

