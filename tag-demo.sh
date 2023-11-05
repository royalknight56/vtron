#!/bin/bash
function tag() {
    git pull --tags
    branch=$(git branch | sed -n '/\* /s///p')
    prefix="demo"

    if [[ $branch == 'release' ]]; then
        prefix="demo-pro"
    elif [[ $branch == "preview" ]]; then
        prefix="demo-pre"
    fi

    new_tag=$(echo ${prefix}-$(date +'%Y%m%d')-$(git tag -l "${prefix}-$(date +'%Y%m%d')-*" | wc -l | xargs printf '%02d'))

    echo $new_tag
    git tag $new_tag
    git push origin $new_tag
}
tag
