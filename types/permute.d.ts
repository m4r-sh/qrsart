export function permuteWIFI(name?: string, pwd?: string): string[];
export function permuteURL(str?: string, { protocols, protocol_caps, domain_caps, path_caps }?: {
    protocols?: string[];
    protocol_caps?: boolean;
    domain_caps?: boolean;
    path_caps?: boolean;
}): any[];
