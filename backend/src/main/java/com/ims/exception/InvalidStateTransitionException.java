package com.ims.exception;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(String message) {
        super(message);
    }

    public InvalidStateTransitionException(String currentStatus, String targetStatus, String reason) {
        super(String.format("Invalid state transition from [%s] to [%s]: %s", currentStatus, targetStatus, reason));
    }
}
