import { addError, EError } from "@vramework/core/errors";

export class AlreadyVotedError extends EError {
  constructor() {
    super('User already voted on this todo')
  }
}

addError(AlreadyVotedError, { status: 409, message: 'User already voted' })