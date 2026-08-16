import { Request, Response, NextFunction } from 'express';
import {
  processVoiceCommand,
  sanitizeVoiceCommand,
  VoiceIntent,
  MAX_VOICE_COMMAND_LENGTH,
} from '../services/voiceCommand.service';
import { createAuditLog } from '../services/auditLog.service';
import {
  AuditAction,
  AuditResourceType,
  AuditOutcome,
} from '../models/AuditLog';
import { UserRole } from '../utils/roles';
import { sendResponse } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

/**
 * POST /api/voice/command
 * Voice Accessibility Backend Support:
 * - Authenticates via JWT middleware.
 * - Extracts caller role from server-side context (`req.user`).
 * - Never trusts client-supplied user IDs or parameters.
 * - Converts recognized speech into safe, structured intents.
 * - Audits `VOICE_COMMAND_EXECUTED` or `VOICE_COMMAND_DENIED` with non-PHI safe metadata.
 * - Performs NO direct database mutations or audio persistence.
 */
export const processVoiceCommandHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
      return next(new AppError('Authentication required.', 401));
    }

    const { command } = req.body || {};

    if (typeof command !== 'string' || command.trim().length === 0) {
      return next(new AppError('Voice command text is mandatory.', 400));
    }

    if (command.length > MAX_VOICE_COMMAND_LENGTH) {
      return next(
        new AppError(
          `Voice command exceeds maximum allowed length of ${MAX_VOICE_COMMAND_LENGTH} characters.`,
          400
        )
      );
    }

    const userRole = req.user.role as UserRole;
    const userId = req.user.id;

    // Process command against authorized role intents
    const result = processVoiceCommand(command, userRole);

    // Audit the command execution or denial
    if (result.allowed) {
      await createAuditLog({
        actorUserId: userId,
        actorRole: userRole,
        action: AuditAction.VOICE_COMMAND_EXECUTED,
        resourceType: AuditResourceType.VOICE_COMMAND,
        targetUserId: userRole === UserRole.PATIENT ? userId : null,
        outcome: AuditOutcome.SUCCESS,
        metadata: {
          intent: result.intent,
          allowed: true,
          commandLength: command.trim().length,
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });
    } else {
      await createAuditLog({
        actorUserId: userId,
        actorRole: userRole,
        action: AuditAction.VOICE_COMMAND_DENIED,
        resourceType: AuditResourceType.VOICE_COMMAND,
        targetUserId: userRole === UserRole.PATIENT ? userId : null,
        outcome:
          result.intent === VoiceIntent.UNKNOWN_COMMAND
            ? AuditOutcome.FAILURE
            : AuditOutcome.DENIED,
        metadata: {
          intent: result.intent,
          allowed: false,
          reason:
            result.intent === VoiceIntent.UNKNOWN_COMMAND
              ? 'Unrecognized command phrase'
              : 'Unauthorized role intent',
          commandLength: command.trim().length,
        },
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || null,
        userAgent: req.headers['user-agent'] || null,
      });
    }

    sendResponse(res, 200, {
      success: true,
      message: result.message,
      data: {
        intent: result.intent,
        allowed: result.allowed,
        message: result.message,
        targetEndpoint: result.targetEndpoint || null,
        requiresParameters: result.requiresParameters || false,
      },
    });
  } catch (error) {
    next(error);
  }
};
