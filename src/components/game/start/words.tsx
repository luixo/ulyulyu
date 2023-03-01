import React from "react";

import {
	Button,
	FormElement,
	Input,
	Spacer,
	styled,
	Text,
} from "@nextui-org/react";
import { produce } from "immer";
import useTranslation from "next-translate/useTranslation";
import { BsSave as SaveIcon } from "react-icons/bs";

import { Card } from "@/components/base/card";
import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { DEFINITIONS, WORDS } from "@/db/contants";
import { WordsId } from "@/db/models";
import {
	useAddWordMutation,
	useSubscribeToWordAddition,
} from "@/hooks/game/use-add-word";
import {
	useRemoveWordMutation,
	useSubscribeToWordRemoval,
} from "@/hooks/game/use-remove-word";
import { useSaveWordDefinitionMutation } from "@/hooks/game/use-save-word-definition";
import {
	useUpdateTermMutation,
	useSubscribeToTermUpdate,
} from "@/hooks/game/use-update-term";
import { Game, useGame } from "@/hooks/use-game";

const ShrinkSpacer = styled(Spacer, { flex: 0 });

// styling doesn't work with some @nextui-org/react components, styles become less prioritized than default ones
const BUTTON_CSS = { minWidth: 120 };

const NEW_WORD_ID = "__new__";

const NEW_WORD_ITEM = {
	position: Infinity,
	word: "",
	definition: "",
};

type WordOverrides = Record<
	WordsId,
	Partial<
		Game["words"][WordsId] & {
			deleted: boolean;
		}
	>
>;
type SetWordOverrides = React.Dispatch<React.SetStateAction<WordOverrides>>;

type InputProps = {
	wordId: WordsId;
	word: Game["words"][WordsId];
	disabled: boolean;
	setOverrides: SetWordOverrides;
	showLabel: boolean;
};

const WordInput = React.memo<InputProps>(
	({ wordId, word, disabled, setOverrides, showLabel }) => {
		const { t } = useTranslation();
		const { words: remoteWords, isOwner } = useGame();
		const saveTermMutation = useUpdateTermMutation();
		const changeTerm = React.useCallback<React.ChangeEventHandler<FormElement>>(
			(e) =>
				setOverrides(
					produce((prevWords) => {
						const lookupWord = prevWords[wordId];
						if (!lookupWord) {
							prevWords[wordId] = { term: e.currentTarget.value };
						} else {
							lookupWord.term = e.currentTarget.value;
						}
					}),
				),
			[setOverrides, wordId],
		);
		const saveTerm = React.useCallback(
			(nextTerm: string) => async () => {
				if (
					nextTerm.length > WORDS.TYPES.MAX_TERM_LENGTH ||
					nextTerm.length < WORDS.TYPES.MIN_TERM_LENGTH
				) {
					return;
				}
				saveTermMutation.mutate({ wordId, term: nextTerm });
				setOverrides(
					produce((words) => {
						const lookupWord = words[wordId];
						if (!lookupWord) {
							return;
						}
						delete lookupWord.term;
					}),
				);
				// TODO: error case
			},
			[saveTermMutation, setOverrides, wordId],
		);
		const originalWord = remoteWords[wordId];
		return (
			<Flex flex={isOwner ? undefined : true} flexChildren>
				<Input
					value={word.term}
					label={
						showLabel && isOwner
							? t("pages.start.words.wordInputLabel")
							: undefined
					}
					aria-label={t("pages.start.words.wordInputLabel")}
					onChange={changeTerm}
					readOnly={!isOwner}
					disabled={isOwner ? disabled : false}
					minLength={WORDS.TYPES.MIN_TERM_LENGTH}
					maxLength={WORDS.TYPES.MAX_TERM_LENGTH}
					contentRight={
						wordId !== NEW_WORD_ID &&
						(originalWord ? originalWord.term !== word.term : true) &&
						!disabled &&
						saveTermMutation.status !== "loading" ? (
							<ClickableIcon
								onClick={saveTerm(word.term)}
								Component={SaveIcon}
							/>
						) : null
					}
					contentRightStyling={false}
				/>
			</Flex>
		);
	},
);

const DefinitionInput = React.memo<InputProps>(
	({ wordId, word, disabled, setOverrides, showLabel }) => {
		const { t } = useTranslation();
		const { words: remoteWords, isOwner } = useGame();

		const saveDefinitionMutation = useSaveWordDefinitionMutation();

		const changeDefinition = React.useCallback<
			React.ChangeEventHandler<FormElement>
		>(
			(e) =>
				setOverrides(
					produce((prevWords) => {
						const lookupWord = prevWords[wordId];
						if (!lookupWord) {
							prevWords[wordId] = { definition: e.currentTarget.value };
						} else {
							lookupWord.definition = e.currentTarget.value;
						}
					}),
				),
			[setOverrides, wordId],
		);
		const saveDefinition = React.useCallback(
			(nextDefinition: string) => async () => {
				if (
					nextDefinition.length > DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH ||
					nextDefinition.length < DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH
				) {
					return;
				}
				setOverrides(
					produce((words) => {
						const lookupWord = words[wordId];
						if (!lookupWord) {
							return;
						}
						delete lookupWord.definition;
					}),
				);
				saveDefinitionMutation.mutate({ wordId, definition: nextDefinition });
				// TODO: error case
			},
			[setOverrides, wordId, saveDefinitionMutation],
		);
		const originalWord = remoteWords[wordId];
		return (
			<Flex flex flexChildren>
				<Input
					value={word.definition ?? ""}
					label={
						showLabel ? t("pages.start.words.definitionInputLabel") : undefined
					}
					aria-label={t("pages.start.words.definitionInputLabel")}
					onChange={changeDefinition}
					readOnly={!isOwner}
					disabled={isOwner ? disabled : false}
					minLength={DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH}
					maxLength={DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH}
					contentRight={
						wordId !== NEW_WORD_ID &&
						(originalWord
							? originalWord.definition !== word.definition
							: true) &&
						!disabled &&
						saveDefinitionMutation.status !== "loading" ? (
							<ClickableIcon
								onClick={saveDefinition(word.definition ?? "")}
								Component={SaveIcon}
							/>
						) : null
					}
					contentRightStyling={false}
				/>
			</Flex>
		);
	},
);

const AddWordButton = React.memo<{
	word: Game["words"][WordsId];
	disabled: boolean;
	addMutation: ReturnType<typeof useAddWordMutation>;
	setOverrides: SetWordOverrides;
}>(({ word, disabled, setOverrides, addMutation }) => {
	const { t } = useTranslation();
	const { id: gameId } = useGame();
	const putWord = React.useCallback(
		(term: string, definition: string) => () => {
			addMutation.mutate({
				gameId,
				term,
				definition,
			});
			setOverrides(
				produce((prevWords) => {
					prevWords[NEW_WORD_ID] = { ...NEW_WORD_ITEM };
				}),
			);
			// TODO: error case
		},
		[setOverrides, addMutation, gameId],
	);
	return (
		<Button
			onClick={putWord(word.term, word.definition ?? "")}
			disabled={disabled}
			auto
			css={BUTTON_CSS}
		>
			{t("pages.start.words.saveButton")}
		</Button>
	);
});

const RemoveWordButton = React.memo<{
	wordId: WordsId;
	setOverrides: SetWordOverrides;
}>(({ wordId, setOverrides }) => {
	const { t } = useTranslation();
	const removeMutation = useRemoveWordMutation();
	const removeWord = React.useCallback(async () => {
		removeMutation.mutate({ id: wordId });
		setOverrides(
			produce((words) => {
				const word = words[wordId];
				if (!word) {
					words[wordId] = { deleted: true };
				} else {
					word.deleted = true;
				}
			}),
		);
		// TODO: error case
	}, [setOverrides, removeMutation, wordId]);
	return (
		<Button onClick={removeWord} color="error" auto css={BUTTON_CSS}>
			{t("pages.start.words.removeButton")}
		</Button>
	);
});

const useSortedWords = (overrides: WordOverrides) => {
	const { words: remoteWords } = useGame();
	const mergedWords = React.useMemo(
		() =>
			[
				...new Set([...Object.keys(remoteWords), ...Object.keys(overrides)]),
			].reduce<
				Record<
					string,
					(typeof remoteWords)[WordsId] & (typeof overrides)[WordsId]
				>
			>((acc, id) => {
				const baseWord = remoteWords[id];
				const overrideWord = overrides[id] || {};
				return { ...acc, [id]: { ...baseWord, ...overrideWord } };
			}, {}),
		[remoteWords, overrides],
	);
	return Object.entries(mergedWords)
		.sort(([, a], [, b]) => a.position - b.position)
		.filter(([, { deleted }]) => !deleted);
};

export const Words = React.memo(() => {
	const { t } = useTranslation();
	const { words: remoteWords, isOwner } = useGame();
	const [wordOverrides, setWordOverrides] = React.useState<
		Record<WordsId, Partial<Game["words"][WordsId] & { deleted: boolean }>>
	>(isOwner ? { [NEW_WORD_ID]: NEW_WORD_ITEM } : {});
	const addMutation = useAddWordMutation();
	useSubscribeToWordAddition();
	useSubscribeToWordRemoval();
	useSubscribeToTermUpdate();

	const sortedWords = useSortedWords(wordOverrides);
	return (
		<Card>
			<Flex crossAxis="center">
				<Text h2>{t("pages.start.words.title")}</Text>
				<Spacer x={0.5} />
			</Flex>
			{sortedWords.map(([id, word], index) => {
				const isAddMutationLoading =
					id === NEW_WORD_ID ? addMutation.isLoading : false;
				return (
					<React.Fragment key={id}>
						<Flex direction="row" crossAxis="end">
							<WordInput
								wordId={id}
								word={word}
								disabled={isAddMutationLoading}
								setOverrides={setWordOverrides}
								showLabel={index === 0}
							/>
							{isOwner ? (
								<>
									<ShrinkSpacer x={1} />
									<DefinitionInput
										wordId={id}
										word={word}
										disabled={isAddMutationLoading}
										setOverrides={setWordOverrides}
										showLabel={index === 0}
									/>
								</>
							) : null}
							{!isOwner ? null : id === NEW_WORD_ID ? (
								<>
									<ShrinkSpacer x={1} />
									<AddWordButton
										word={word}
										disabled={isAddMutationLoading}
										setOverrides={setWordOverrides}
										addMutation={addMutation}
									/>
								</>
							) : (
								<>
									<ShrinkSpacer x={1} />
									<RemoveWordButton
										wordId={id}
										setOverrides={setWordOverrides}
									/>
								</>
							)}
						</Flex>
						<Spacer y={1} />
					</React.Fragment>
				);
			})}
			{Object.keys(remoteWords).length === 0 && !isOwner ? (
				<Text h3>{t("pages.start.words.emptyTitle")}</Text>
			) : null}
		</Card>
	);
});
