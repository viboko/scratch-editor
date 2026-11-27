import {defaultLoadingMessages as loaderMessages} from './loader.jsx';

/** A message the loader can show, as a react-intl message descriptor, and how often it is picked. */
export interface LoadingMessage {
    message: {
        id: string;
        defaultMessage: string;
        description?: string;
    };
    weight: number;
}

/**
 * The messages the loader picks from when the GUI has no `loadingMessages` prop. An embedding app can filter these to
 * leave some out, keeping the rest's weights and translations.
 */
export const defaultLoadingMessages: LoadingMessage[] = loaderMessages;
