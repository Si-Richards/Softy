
/**
 * Format a phone number to E.164 format with proper SIP URI
 * Example output: sip:+441254389384@62.239.24.186;user=phone
 * 
 * @param number - The phone number to format
 * @param sipHost - The SIP host address
 * @returns Formatted SIP URI
 */
export function formatE164Number(number: string, sipHost?: string): string {
  // Remove any non-digit characters
  const digits = number.replace(/\D/g, '');
  
  // Check if the number already has a country code
  const hasCountryCode = digits.startsWith('44') || digits.startsWith('+44');
  
  // Format with UK country code (+44) if it doesn't already have one
  // and if the number isn't a special service number (like 3-digit numbers)
  let formattedNumber = digits;
  
  // Special service numbers and short codes (like 160) should remain as-is
  if (digits.length <= 3) {
    // Don't add country code to short service numbers
    formattedNumber = digits;
  } else if (digits.length > 3 && !hasCountryCode) {
    // For regular numbers, add country code if missing
    // If number starts with 0, remove it before adding country code
    formattedNumber = '+44' + (digits.startsWith('0') ? digits.substring(1) : digits);
  } else if (digits.startsWith('44') && !digits.startsWith('+44')) {
    // If it has 44 but not the plus sign
    formattedNumber = '+' + digits;
  }

  // If no host is provided, just return the formatted E.164 number
  if (!sipHost) {
    return formattedNumber;
  }
  
  // For service numbers like 160, don't use the E.164 format
  if (digits.length <= 3) {
    return `sip:${formattedNumber}@${sipHost}`;
  }
  
  // Return full SIP URI with user=phone parameter
  return `sip:${formattedNumber}@${sipHost};user=phone`;
}
