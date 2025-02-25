import { addError, EError } from "@pikku/core/errors";

export class AlreadyVotedError extends EError {
  constructor() {
    super('User already voted on this todo')
  }
}

addError(AlreadyVotedError, { status: 409, message: 'User already voted' })