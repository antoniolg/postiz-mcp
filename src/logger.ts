import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'postiz-mcp-debug.log');

export function log(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data })
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Log to console (stderr for MCP)
    console.error(`[${timestamp}] ${level}: ${message}`);
    if (data) {
        console.error('Data:', JSON.stringify(data, null, 2));
    }
    
    // Log to file
    try {
        fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

export function logRequest(method: string, url: string, headers: any, body?: any) {
    log('DEBUG', `${method} Request`, {
        url,
        headers: {
            ...headers,
            // Ocultar la API key completa por seguridad
            ...(headers.Authorization && { 
                Authorization: headers.Authorization.substring(0, 12) + '...' 
            })
        },
        ...(body && { body })
    });
}

export function logResponse(status: number, headers: any, data: any, isHtml: boolean = false) {
    log('DEBUG', `Response ${status}`, {
        status,
        headers,
        dataType: typeof data,
        isHtml,
        dataPreview: isHtml ? 
            `HTML (${data.length} chars): ${data.substring(0, 200)}...` :
            data
    });
}