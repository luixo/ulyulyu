import React from "react";

import { Button, Card, CardBody, Input } from "@heroui/react";
import { useTranslation } from "react-i18next";
import {
  IoAddCircle as AddIcon,
  IoTrashOutline as RemoveIcon,
  IoSave as SaveIcon,
} from "react-icons/io5";
import { entries, keys, omit } from "remeda";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { DEFINITIONS, WORDS } from "~/db/const";
import {
  useAddWordMutation,
  useSubscribeToWordAddition,
} from "~/hooks/game/use-add-word";
import {
  useRemoveWordMutation,
  useSubscribeToWordRemoval,
} from "~/hooks/game/use-remove-word";
import { useSaveWordDefinitionMutation } from "~/hooks/game/use-save-word-definition";
import {
  useSubscribeToTermUpdate,
  useUpdateTermMutation,
} from "~/hooks/game/use-update-term";
import type { Game } from "~/hooks/use-game";
import { useGame } from "~/hooks/use-game";
import type { WordId } from "~/server/validation";

const NEW_WORD_ID = "__new__" as WordId;

const NEW_WORD_ITEM: Game["words"][WordId] = {
  position: Infinity,
  term: "",
  definition: "",
};

type WordOverrides = Record<
  WordId,
  Partial<
    Game["words"][WordId] & {
      deleted: boolean;
    }
  >
>;
type SetWordOverrides = React.Dispatch<React.SetStateAction<WordOverrides>>;

type InputProps = {
  wordId: WordId;
  word: Game["words"][WordId];
  disabled: boolean;
  setOverrides: SetWordOverrides;
  showLabel: boolean;
};

const WordInput: React.FC<InputProps> = ({
  wordId,
  word,
  disabled,
  setOverrides,
  showLabel,
}) => {
  const { t } = useTranslation();
  const { words: remoteWords, isOwner } = useGame();
  const saveTermMutation = useUpdateTermMutation();
  const originalWord = remoteWords[wordId];
  return (
    <div className="flex-1">
      <Input
        value={word.term}
        label={
          showLabel && isOwner
            ? t("pages.start.words.wordInputLabel")
            : undefined
        }
        aria-label={t("pages.start.words.wordInputLabel")}
        labelPlacement="outside"
        onValueChange={(nextValue) =>
          setOverrides((prevWords) => ({
            ...prevWords,
            [wordId]: { ...prevWords[wordId], term: nextValue },
          }))
        }
        isReadOnly={!isOwner}
        isDisabled={disabled}
        minLength={WORDS.TYPES.MIN_TERM_LENGTH}
        maxLength={WORDS.TYPES.MAX_TERM_LENGTH}
        endContent={
          wordId !== NEW_WORD_ID &&
          (originalWord ? originalWord.term !== word.term : true) &&
          !disabled &&
          saveTermMutation.status !== "pending" ? (
            <ClickableIcon
              onClick={() => {
                const nextTerm = word.term;
                if (
                  nextTerm.length > WORDS.TYPES.MAX_TERM_LENGTH ||
                  nextTerm.length < WORDS.TYPES.MIN_TERM_LENGTH
                ) {
                  return;
                }
                saveTermMutation.mutate({ wordId, term: nextTerm });
                setOverrides((prevWords) =>
                  prevWords[wordId]
                    ? {
                        ...prevWords,
                        [wordId]: omit(prevWords[wordId], ["term"]),
                      }
                    : prevWords,
                );
                // TODO: error case
              }}
              Component={SaveIcon}
            />
          ) : (
            // Bug: https://github.com/nextui-org/nextui/issues/2069
            <div />
          )
        }
      />
    </div>
  );
};

const DefinitionInput: React.FC<InputProps> = ({
  wordId,
  word,
  disabled,
  setOverrides,
  showLabel,
}) => {
  const { t } = useTranslation();
  const { words: remoteWords, isOwner } = useGame();

  const saveDefinitionMutation = useSaveWordDefinitionMutation();

  const originalWord = remoteWords[wordId];
  const isDefinitionDifferent =
    wordId !== NEW_WORD_ID &&
    (originalWord ? originalWord.definition !== word.definition : true);
  return (
    <div className="flex-1">
      <Input
        value={word.definition ?? ""}
        label={
          showLabel ? t("pages.start.words.definitionInputLabel") : undefined
        }
        labelPlacement="outside"
        aria-label={t("pages.start.words.definitionInputLabel")}
        onValueChange={(nextDefinition: string) =>
          setOverrides((prevWords) => ({
            ...prevWords,
            [wordId]: { ...prevWords[wordId], definition: nextDefinition },
          }))
        }
        isReadOnly={!isOwner}
        isDisabled={disabled}
        minLength={DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH}
        maxLength={DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH}
        color={isDefinitionDifferent ? "warning" : "default"}
        endContent={
          isDefinitionDifferent &&
          !disabled &&
          saveDefinitionMutation.status !== "pending" ? (
            <ClickableIcon
              onClick={() => {
                const nextDefinition = word.definition ?? "";
                if (
                  nextDefinition.length >
                    DEFINITIONS.TYPES.MAX_DEFINITION_LENGTH ||
                  nextDefinition.length <
                    DEFINITIONS.TYPES.MIN_DEFINITION_LENGTH
                ) {
                  return;
                }
                setOverrides((prevWords) =>
                  prevWords[wordId]
                    ? {
                        ...prevWords,
                        [wordId]: omit(prevWords[wordId], ["definition"]),
                      }
                    : prevWords,
                );
                saveDefinitionMutation.mutate({
                  wordId,
                  definition: nextDefinition,
                });
                // TODO: error case
              }}
              Component={SaveIcon}
            />
          ) : (
            // Bug: https://github.com/nextui-org/nextui/issues/2069
            <div />
          )
        }
      />
    </div>
  );
};

const AddWordButton: React.FC<{
  word: Game["words"][WordId];
  disabled: boolean;
  addMutation: ReturnType<typeof useAddWordMutation>;
  setOverrides: SetWordOverrides;
}> = ({ word, disabled, setOverrides, addMutation }) => {
  const { id: gameId } = useGame();
  return (
    <Button
      color="primary"
      onPress={() => {
        addMutation.mutate({
          gameId,
          term: word.term,
          definition: word.definition ?? "",
        });
        setOverrides((prevWords) => ({
          ...prevWords,
          [NEW_WORD_ID]: { ...NEW_WORD_ITEM },
        }));
        // TODO: error case
      }}
      isDisabled={disabled}
      isIconOnly
      variant="bordered"
    >
      <AddIcon size={24} />
    </Button>
  );
};

const RemoveWordButton: React.FC<{
  wordId: WordId;
  setOverrides: SetWordOverrides;
}> = ({ wordId, setOverrides }) => {
  const removeMutation = useRemoveWordMutation();
  return (
    <Button
      onPress={() => {
        removeMutation.mutate({ id: wordId });
        setOverrides((prevWords) => ({
          ...prevWords,
          [wordId]: { ...prevWords[wordId], deleted: true },
        }));
        // TODO: error case
      }}
      color="danger"
      isIconOnly
      variant="bordered"
    >
      <RemoveIcon size={24} />
    </Button>
  );
};

const useSortedWords = (overrides: WordOverrides) => {
  const { words: remoteWords } = useGame();
  const mergedWords = [
    ...new Set([...keys(remoteWords), ...keys(overrides)]),
  ].reduce<
    Record<WordId, (typeof remoteWords)[WordId] & (typeof overrides)[WordId]>
  >((acc, id) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const baseWord = remoteWords[id]!;
    const overrideWord = overrides[id] || {};
    return { ...acc, [id]: { ...baseWord, ...overrideWord } };
  }, {});
  return entries(mergedWords)
    .sort(([, a], [, b]) => a.position - b.position)
    .filter(([, { deleted }]) => !deleted);
};

export const Words = () => {
  const { t } = useTranslation();
  const { words: remoteWords, isOwner } = useGame();
  const [wordOverrides, setWordOverrides] = React.useState<
    Record<WordId, Partial<Game["words"][WordId] & { deleted: boolean }>>
  >(isOwner ? { [NEW_WORD_ID]: NEW_WORD_ITEM } : {});
  const addMutation = useAddWordMutation();
  useSubscribeToWordAddition();
  useSubscribeToWordRemoval();
  useSubscribeToTermUpdate();
  const sortedWords = useSortedWords(wordOverrides);

  return (
    <Card>
      <CardBody className="flex flex-col gap-2">
        <div className="flex justify-between">
          <h2 className="text-2xl">{t("pages.start.words.title")}</h2>
        </div>
        {sortedWords.map(([id, word], index) => {
          const isAddMutationLoading =
            id === NEW_WORD_ID ? addMutation.isPending : false;
          return (
            <div key={id} className="flex flex-row items-end gap-2">
              <WordInput
                wordId={id}
                word={word}
                disabled={isAddMutationLoading}
                setOverrides={setWordOverrides}
                showLabel={index === 0}
              />
              {isOwner ? (
                <DefinitionInput
                  wordId={id}
                  word={word}
                  disabled={isAddMutationLoading}
                  setOverrides={setWordOverrides}
                  showLabel={index === 0}
                />
              ) : null}
              {!isOwner ? null : id === NEW_WORD_ID ? (
                <AddWordButton
                  word={word}
                  disabled={isAddMutationLoading}
                  setOverrides={setWordOverrides}
                  addMutation={addMutation}
                />
              ) : (
                <RemoveWordButton wordId={id} setOverrides={setWordOverrides} />
              )}
            </div>
          );
        })}
        {keys(remoteWords).length === 0 && !isOwner ? (
          <h3>{t("pages.start.words.emptyTitle")}</h3>
        ) : null}
      </CardBody>
    </Card>
  );
};
