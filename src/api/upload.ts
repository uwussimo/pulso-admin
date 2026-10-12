import { api } from './client'
import type { UploadResponse } from './types'

/**
 * Operator-side asset upload. The returned `public_url` is what an author
 * embeds into a rich-text notification body, so the editor never has to
 * know the bucket layout.
 *
 * A multipart body means the shared JSON helpers cannot carry it; the
 * FormData is passed straight through and the browser sets the boundary.
 */
async function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  return api.upload<UploadResponse>('/internal/upload', form)
}

export const uploadApi = {
  image: uploadImage,
}
