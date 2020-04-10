import * as React from 'react'
import { useQuery, useMutation } from 'react-query'
import fetch from 'isomorphic-unfetch'
import cloudinary from 'cloudinary-core'

export function useUpload() {
  const [uploadedImageData, setUploadedImageData] = React.useState()
  const [mutate] = useMutation(async ({ file, uploadOptions }) => {
    const res = await fetch('/.netlify/functions/upload', {
      method: 'POST',
      body: JSON.stringify({
        tags: uploadOptions.tags,
        public_id: uploadOptions.public_id,
        file
      })
    })

    return res.json()
  }, {
    onSuccess: data => {
      return setUploadedImageData(data)
    }
  })

  return [mutate, uploadedImageData]
}

export function useImage({ cloud_name }) {
  const cld = cloudinary.Cloudinary.new({ cloud_name })
  let cloudinaryObject

  const [tag, setTag] = React.useState()

  // This request only fires when getImagesbyTag is called
  const { data: taggedImageData, status, error } = useQuery(tag && ['images', tag], async (key, tag) => {
    /*

     To enable the list type you must:
      1. Go to your account Settings
      2. Click Security
      3. Inside 'Restricted media types' uncheck 'Resource list'

    */
    const url = await cld.url(`${tag}.json`, { type: 'list' })
    const images = await fetch(url)
    return images.json()
  })

  function getImage({ public_id, transform_options }) {
    return cld.url(public_id, { ...transform_options, crop: 'scale' })
  }

  /*
    This function can be used in a useEffect or by firing an action that will set the tag name for us.
    You also need to make sure you add tags on upload or after.
    TODO:
      [x] What happens when the tag doesn't exist? Can we error handle that with react-query?
  */
  function getImagesByTag(tagName) {
    return setTag(tagName)
  }

  cloudinaryObject = {
    getImage,
    getImagesByTag
  }

  return [cloudinaryObject, taggedImageData, status, error]

}