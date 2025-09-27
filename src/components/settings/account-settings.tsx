import { Modal, ModalBody, ModalContent, useDisclosure } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { IoPerson as UserIcon } from "react-icons/io5";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { UserIdInfo } from "~/components/settings/user-id-info";
import { UserOverride } from "~/components/settings/user-override";

export const AccountSettings = () => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <ClickableIcon Component={UserIcon} size={24} onClick={onOpen} />
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          <ModalBody className="p-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-2xl font-semibold">
                {t("accountSettings.title")}
              </h3>
              <UserIdInfo />
              <UserOverride />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
