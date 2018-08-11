import * as Promise from 'bluebird'

import Photo, { PhotoId } from '../../common/models/Photo'
import Tag from '../../common/models/Tag'
import { fetchTagsAction, createTagsAction } from '../state/actions'
import store from '../state/store'
import { assertRendererProcess } from '../../common/util/ElectronUtil'


assertRendererProcess()

export function fetchTags() {
    Tag.forge()
        .query(q => q.orderBy('slug', 'ASC'))
        .fetchAll()
        .then(tags => {
            store.dispatch(fetchTagsAction(tags.toJSON()))
        })
        // TODO: Error handling
}


export function createTagsAndAssociateToPhoto(tagNames: string[], photoId: PhotoId) {
    new Photo({ id: photoId })
        .fetch()
        // TODO: Remove all the previous tag before adding the new one
        .then(photo => Promise.map(tagNames, tagName => new Tag({ title: tagName })
            .fetch()
            .then(tag => {
                if (tag) {
                    return tag
                }
        
                return new Tag({ title: tagName }).save()
            })
            .then(tag => tag
                .photos()
                .attach(photo)
                .then(() => tag.toJSON())
            )
        ))
        .then(tags => {
            store.dispatch(createTagsAction(tags))
        })
        .catch(error => {
            // TODO: Show error to the user
            console.error('Creating tags failed', error)
        })
}