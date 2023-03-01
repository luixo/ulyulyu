import React from "react";

import { Modal, Text } from "@nextui-org/react";
import useTranslation from "next-translate/useTranslation";
import { FiSettings as GearIcon } from "react-icons/fi";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { LangSwitcher } from "@/components/settings/lang-switcher";

export const Settings = React.memo(() => {
	const { t } = useTranslation();
	const [modalOpen, setModalOpen] = React.useState(false);
	const openModal = React.useCallback(() => setModalOpen(true), []);
	const closeModal = React.useCallback(() => setModalOpen(false), []);

	return (
		<div>
			<ClickableIcon Component={GearIcon} size={24} onClick={openModal} />
			<Modal closeButton open={modalOpen} onClose={closeModal}>
				<Modal.Header>
					<Text h2>{t("settings.title")}</Text>
				</Modal.Header>
				<Modal.Body autoMargin={false}>
					<LangSwitcher />
				</Modal.Body>
			</Modal>
		</div>
	);
});
