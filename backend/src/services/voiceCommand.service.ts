import { UserRole } from '../utils/roles';
import { AppError } from '../middleware/error.middleware';

export enum VoiceIntent {
  READ_VITALS = 'READ_VITALS',
  READ_MEDICATIONS = 'READ_MEDICATIONS',
  READ_ALLERGIES = 'READ_ALLERGIES',
  READ_HEALTH_SUMMARY = 'READ_HEALTH_SUMMARY',
  LIST_DOCUMENTS = 'LIST_DOCUMENTS',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  READ_NOTES = 'READ_NOTES',
  READ_PRESCRIPTIONS = 'READ_PRESCRIPTIONS',
  HELP = 'HELP',
  UNKNOWN_COMMAND = 'UNKNOWN_COMMAND',
}

export interface IVoiceCommandResult {
  intent: VoiceIntent;
  allowed: boolean;
  message: string;
  targetEndpoint?: string | null;
  requiresParameters?: boolean;
}

export const MAX_VOICE_COMMAND_LENGTH = 300;

/**
 * Sanitize voice command string:
 * - strips unprintable / control characters
 * - normalizes whitespace
 * - caps length
 */
export const sanitizeVoiceCommand = (input: unknown): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_VOICE_COMMAND_LENGTH);
};

/**
 * Matches natural language voice phrases to a structured VoiceIntent.
 */
export const parseVoiceIntent = (normalizedText: string): VoiceIntent => {
  const text = normalizedText.toLowerCase();

  // HELP
  if (
    text === 'help' ||
    text === 'what can i say' ||
    text.includes('help me') ||
    text.includes('list commands') ||
    text.includes('available commands') ||
    text.includes('show help')
  ) {
    return VoiceIntent.HELP;
  }

  // READ_VITALS
  if (
    text.includes('read vitals') ||
    text.includes('read my vitals') ||
    text.includes('show vitals') ||
    text.includes('show my vitals') ||
    text.includes('check vitals') ||
    text.includes('check my vitals') ||
    text.includes('get vitals') ||
    text.includes('get my vitals') ||
    text.includes('my vitals') ||
    text.includes('vital signs') ||
    text.includes('blood pressure') ||
    text.includes('heart rate') ||
    text.includes('pulse')
  ) {
    return VoiceIntent.READ_VITALS;
  }

  // READ_MEDICATIONS
  if (
    text.includes('read medications') ||
    text.includes('read my medications') ||
    text.includes('show medications') ||
    text.includes('show my medications') ||
    text.includes('list medications') ||
    text.includes('list my medications') ||
    text.includes('my medications') ||
    text.includes('my meds') ||
    text.includes('active medications') ||
    text.includes('current prescriptions') ||
    text.includes('current medications')
  ) {
    return VoiceIntent.READ_MEDICATIONS;
  }

  // READ_ALLERGIES
  if (
    text.includes('read allergies') ||
    text.includes('read my allergies') ||
    text.includes('show allergies') ||
    text.includes('show my allergies') ||
    text.includes('list allergies') ||
    text.includes('list my allergies') ||
    text.includes('my allergies') ||
    text.includes('allergy list') ||
    text.includes('drug allergies')
  ) {
    return VoiceIntent.READ_ALLERGIES;
  }

  // READ_HEALTH_SUMMARY
  if (
    text.includes('health summary') ||
    text.includes('read health summary') ||
    text.includes('read my health summary') ||
    text.includes('show summary') ||
    text.includes('show my summary') ||
    text.includes('digital twin summary') ||
    text.includes('read digital twin') ||
    text.includes('my digital twin') ||
    text.includes('overall health') ||
    text.includes('health status')
  ) {
    return VoiceIntent.READ_HEALTH_SUMMARY;
  }

  // UPLOAD_DOCUMENT (Must be checked before LIST_DOCUMENTS if phrased "upload document")
  if (
    text.includes('upload document') ||
    text.includes('upload medical document') ||
    text.includes('upload file') ||
    text.includes('upload report') ||
    text.includes('add document') ||
    text.includes('attach document')
  ) {
    return VoiceIntent.UPLOAD_DOCUMENT;
  }

  // LIST_DOCUMENTS
  if (
    text.includes('list documents') ||
    text.includes('list my documents') ||
    text.includes('read documents') ||
    text.includes('read my documents') ||
    text.includes('show documents') ||
    text.includes('show my documents') ||
    text.includes('my documents') ||
    text.includes('medical documents') ||
    text.includes('lab reports') ||
    text.includes('view documents')
  ) {
    return VoiceIntent.LIST_DOCUMENTS;
  }

  // READ_NOTES
  if (
    text.includes('read notes') ||
    text.includes('read my notes') ||
    text.includes('show notes') ||
    text.includes('show my notes') ||
    text.includes('clinical notes') ||
    text.includes('doctor notes') ||
    text.includes('list notes')
  ) {
    return VoiceIntent.READ_NOTES;
  }

  // READ_PRESCRIPTIONS
  if (
    text.includes('read prescriptions') ||
    text.includes('read my prescriptions') ||
    text.includes('show prescriptions') ||
    text.includes('show my prescriptions') ||
    text.includes('list prescriptions') ||
    text.includes('my prescriptions') ||
    text.includes('rx list')
  ) {
    return VoiceIntent.READ_PRESCRIPTIONS;
  }

  return VoiceIntent.UNKNOWN_COMMAND;
};

/**
 * Process a voice command string in the context of an authenticated user role.
 * Enforces role-based intent filtering, safe read-only messaging, and rejection of mutation attempts.
 */
export const processVoiceCommand = (
  rawCommand: string,
  userRole: UserRole
): IVoiceCommandResult => {
  const sanitized = sanitizeVoiceCommand(rawCommand);

  if (!sanitized || sanitized.length === 0) {
    throw new AppError('Voice command is empty or invalid.', 400);
  }

  const intent = parseVoiceIntent(sanitized);

  // UNKNOWN_COMMAND handling
  if (intent === VoiceIntent.UNKNOWN_COMMAND) {
    return {
      intent: VoiceIntent.UNKNOWN_COMMAND,
      allowed: false,
      message:
        'Voice command not recognized. Say "Help" to hear the list of supported commands.',
      targetEndpoint: null,
    };
  }

  // HELP intent is open to all authenticated roles
  if (intent === VoiceIntent.HELP) {
    if (userRole === UserRole.PATIENT) {
      return {
        intent: VoiceIntent.HELP,
        allowed: true,
        message:
          'Available patient voice commands: "Read my vitals", "Read my medications", "Read my allergies", "Read health summary", "List documents", "Upload document", "Read notes", "Read prescriptions".',
        targetEndpoint: null,
      };
    } else if (userRole === UserRole.DOCTOR) {
      return {
        intent: VoiceIntent.HELP,
        allowed: true,
        message:
          'Doctor voice accessibility supports read-only navigational intents. Use standard dashboard controls to select a consented patient record.',
        targetEndpoint: null,
      };
    } else {
      return {
        intent: VoiceIntent.HELP,
        allowed: true,
        message:
          'Admin voice accessibility supports system status queries. Use administrator console for audit log verification.',
        targetEndpoint: null,
      };
    }
  }

  // Role-based access control for patient clinical intents
  // Patients have direct ownership access to their own digital twin readings
  if (userRole === UserRole.PATIENT) {
    switch (intent) {
      case VoiceIntent.READ_VITALS:
        return {
          intent: VoiceIntent.READ_VITALS,
          allowed: true,
          message: 'Reading your latest vitals.',
          targetEndpoint: '/api/patient/vitals',
        };

      case VoiceIntent.READ_MEDICATIONS:
        return {
          intent: VoiceIntent.READ_MEDICATIONS,
          allowed: true,
          message: 'Reading your active medications.',
          targetEndpoint: '/api/patient/medications',
        };

      case VoiceIntent.READ_ALLERGIES:
        return {
          intent: VoiceIntent.READ_ALLERGIES,
          allowed: true,
          message: 'Reading your recorded allergies.',
          targetEndpoint: '/api/patient/allergies',
        };

      case VoiceIntent.READ_HEALTH_SUMMARY:
        return {
          intent: VoiceIntent.READ_HEALTH_SUMMARY,
          allowed: true,
          message: 'Reading your Digital Twin health summary.',
          targetEndpoint: '/api/patient/twin',
        };

      case VoiceIntent.LIST_DOCUMENTS:
        return {
          intent: VoiceIntent.LIST_DOCUMENTS,
          allowed: true,
          message: 'Listing your uploaded medical documents.',
          targetEndpoint: '/api/patient/documents',
        };

      case VoiceIntent.UPLOAD_DOCUMENT:
        return {
          intent: VoiceIntent.UPLOAD_DOCUMENT,
          allowed: true,
          message:
            'Opening medical document upload prompt. Document file selection required.',
          targetEndpoint: '/api/patient/documents/upload',
          requiresParameters: true,
        };

      case VoiceIntent.READ_NOTES:
        return {
          intent: VoiceIntent.READ_NOTES,
          allowed: true,
          message: 'Reading clinical notes added by your attending physicians.',
          targetEndpoint: '/api/patient/notes',
        };

      case VoiceIntent.READ_PRESCRIPTIONS:
        return {
          intent: VoiceIntent.READ_PRESCRIPTIONS,
          allowed: true,
          message: 'Reading your active and historic prescriptions.',
          targetEndpoint: '/api/patient/prescriptions',
        };

      default:
        return {
          intent: VoiceIntent.UNKNOWN_COMMAND,
          allowed: false,
          message: 'Unrecognized voice command.',
        };
    }
  }

  // Doctor or Admin trying to invoke personal patient voice queries directly without consented patient context
  if (userRole === UserRole.DOCTOR) {
    return {
      intent,
      allowed: false,
      message:
        'Doctor clinical access requires an explicit patient selection with verified active consent or emergency break-glass authorization.',
      targetEndpoint: null,
    };
  }

  // Admin trying to invoke clinical voice queries
  if (userRole === UserRole.ADMIN) {
    return {
      intent,
      allowed: false,
      message:
        'Administrative accounts are not authorized to access clinical patient records.',
      targetEndpoint: null,
    };
  }

  return {
    intent: VoiceIntent.UNKNOWN_COMMAND,
    allowed: false,
    message: 'Unauthorized voice command.',
    targetEndpoint: null,
  };
};
