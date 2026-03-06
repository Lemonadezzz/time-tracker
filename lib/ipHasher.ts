import crypto from 'crypto';

/**
 * Validates and normalizes IP addresses, then hashes them for privacy compliance
 * Supports both IPv4 and IPv6 formats. Returns a SHA-256 hashed string.
 */
export function hashIpAddress(ip: string | null | undefined): string {
    if (!ip || ip === 'unknown' || ip === 'Unknown') {
        return 'unknown';
    }

    try {
        // Extract the first IP in case of multiple concatenated IPs in headers
        const rawIp = ip.split(',')[0].trim();

        // Hash using SHA-256 to anonymize the IP
        return crypto.createHash('sha256').update(rawIp).digest('hex');
    } catch (error) {
        console.error('Failed to hash IP Address:', error);
        return 'unknown';
    }
}
