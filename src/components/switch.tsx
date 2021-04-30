import { Switch } from '@headlessui/react';

type Props = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  accessibility: string;
};

export default function StyledSwitch({
  enabled,
  setEnabled,
  accessibility
}: Props) {
  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      className={`${
        enabled ? 'bg-purple-400' : 'bg-gray-200'
      } relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
    >
      <span className="sr-only">{accessibility}</span>
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } pointer-events-none inline-block w-4 h-4 bg-white rounded-full shadow-lg transform ring-0 transition ease-in-out duration-200`}
      />
    </Switch>
  );
}
