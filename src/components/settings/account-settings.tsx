import React from "react";

import { Modal, Text } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";
import { FaUser as UserIcon } from "react-icons/fa";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { UserIdInfo } from "@/components/settings/user-id-info";

export const AccountSettings = React.memo(() => {
	const { t } = useTranslation();
	const [modalOpen, setModalOpen] = React.useState(false);
	const openModal = React.useCallback(() => setModalOpen(true), []);
	const closeModal = React.useCallback(() => setModalOpen(false), []);

	return (
		<>
			<ClickableIcon Component={UserIcon} size={24} onClick={openModal} />
			<Modal closeButton open={modalOpen} onClose={closeModal}>
				<Modal.Body>
					<Flex direction="column" crossAxis="center" mainAxis="center">
						<Text h3>{t("accountSettings.title")}</Text>
						<UserIdInfo />
					</Flex>
				</Modal.Body>
			</Modal>
		</>
	);
});
