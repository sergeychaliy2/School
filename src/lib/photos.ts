import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Photos attached to homework are copied into the app's own storage.
 *
 * The picker hands back a URI pointing into the gallery (or a cache folder the
 * OS may purge). Keeping that reference means a student who tidies their gallery
 * loses the photo of the blackboard — which may have been the whole assignment.
 * Copying costs a few hundred kilobytes and removes that whole class of loss.
 */

const FOLDER = 'homework-photos';

function folder(): Directory {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function extensionOf(uri: string): string {
  const match = /\.([a-zA-Z0-9]{2,5})(?:\?|$)/.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

/**
 * Copies a picked photo into app storage and returns the new URI.
 * Falls back to the original URI if the copy fails — a photo that might vanish
 * later is still better than losing the attachment now.
 */
export async function keepPhoto(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri; // no app-private storage in a browser
  try {
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extensionOf(uri)}`;
    const destination = new File(folder(), name);
    await new File(uri).copy(destination);
    return destination.uri;
  } catch {
    return uri;
  }
}

/** Removes a copy we made. Ignores URIs that live outside our folder. */
export function dropPhoto(uri: string): void {
  if (Platform.OS === 'web') return;
  if (!uri.includes(FOLDER)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    /* a leftover file wastes a little space; never break the UI over it */
  }
}

export function dropPhotos(uris: string[] | undefined): void {
  for (const uri of uris ?? []) dropPhoto(uri);
}
