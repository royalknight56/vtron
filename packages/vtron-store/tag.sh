#!/bin/bash
function tag() {
    git pull --tags
    branch=$(git branch | sed -n '/\* /s///p')
    prefix="test"

    if [[ $branch == 'release' ]]; then
        prefix="pro"
    elif [[ $branch == "preview" ]]; then
        prefix="pre"
    fi

    new_tag=$(echo ${prefix}-$(date +'%Y%m%d')-$(git tag -l "${prefix}-$(date +'%Y%m%d')-*" | wc -l | xargs printf '%02d'))

    echo $new_tag
    git tag $new_tag
    git push origin $new_tag
}
tag
