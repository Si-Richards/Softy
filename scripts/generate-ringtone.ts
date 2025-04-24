
import { generateRingtone } from '../src/utils/ringtoneGenerator';

generateRingtone().then(path => {
  console.log(`Ringtone generated at: ${path}`);
}).catch(error => {
  console.error('Failed to generate ringtone:', error);
});
