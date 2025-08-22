import React from "react";

import { Modal, ModalContent, Spinner, useDisclosure } from "@heroui/react";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  IoCloseOutline as ErrorIcon,
  IoCheckmarkOutline as SaveIcon,
} from "react-icons/io5";

import { ErrorMessage } from "~/components/error-message";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: UseMutationResult<any, any, any>;
  onClick: () => void;
  isVisible: boolean;
};

export const SaveAction = React.memo<Props>(
  ({ isVisible, mutation, onClick }) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    React.useEffect(() => {
      if (mutation.status === "error") {
        onOpen();
      }
    }, [mutation.status, onOpen]);
    if (!isVisible) {
      return null;
    }
    if (mutation.status === "pending") {
      return <Spinner color="current" size="sm" />;
    }
    if (mutation.status === "error") {
      return (
        <>
          <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
              <ErrorMessage error={mutation.error} />
            </ModalContent>
          </Modal>
          <ErrorIcon size={24} onClick={onOpen} />
        </>
      );
    }
    return <SaveIcon size={24} className="cursor-pointer" onClick={onClick} />;
  },
);
