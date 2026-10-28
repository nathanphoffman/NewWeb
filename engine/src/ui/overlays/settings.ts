import { DECIMAL_RADIX, DIALOG_TAG } from '../../shared/constants';
import { setMaxImageKb } from '../../shared/imageLimit';
import { makeElement, openDialog } from '../dom';
import { closeModals } from './modals';
import { buildActions, buildAnimationSection, buildDataSection, buildImageSection } from './settingsSections';

// saves the typed image limit if it is a positive number, otherwise keeps the old one
function saveImageLimit(typed: string): void {
  const value = parseInt(typed, DECIMAL_RADIX);

  if (!Number.isNaN(value) && value > 0) setMaxImageKb(value);
}

// builds the settings dialog: saving or viewing data closes it, and cancel just closes it
function buildSettingsDialog(entryCount: number, onViewData: () => void): HTMLDialogElement {
  const dialog = makeElement(DIALOG_TAG, 'nw-settings-modal');
  const images = buildImageSection();
  const closeDialog = () => dialog.remove();

  dialog.append(
    makeElement('h2', '', 'Settings'),
    images.section,
    buildAnimationSection(),
    buildDataSection(entryCount, () => { closeDialog(); onViewData(); }),
    buildActions(() => { saveImageLimit(images.input.value); closeDialog(); }, closeDialog),
  );

  return dialog;
}

// builds and opens the settings dialog with sections for image size, animations, and session data
export function showSettingsModal(
  getEntries: () => [string, string][],
  onViewData: () => void,
): void {
  closeModals();
  openDialog(buildSettingsDialog(getEntries().length, onViewData));
}
