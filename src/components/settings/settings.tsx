import React from "react";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { IoSettings as GearIcon } from "react-icons/io5";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { LangSwitcher } from "~/components/settings/lang-switcher";

export const Settings = React.memo(() => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div>
      <ClickableIcon Component={GearIcon} size={24} onClick={onOpen} />
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
        <ModalContent>
          <ModalHeader className="self-center">
            <h2 className="text-2xl">{t("settings.title")}</h2>
          </ModalHeader>
          <ModalBody>
            <LangSwitcher />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
});
