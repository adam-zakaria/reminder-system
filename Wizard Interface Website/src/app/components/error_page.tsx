'use client';
import React from 'react';

export default function ErrorPage({msgs = "unknown error"}) {
    return (
        <div>
            <h1>Error</h1>
            <p>{msgs}</p>
        </div>
    )
}

