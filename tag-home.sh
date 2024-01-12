#!/bin/bash
###
 # @Author: RoyalKnight
 # @LastEditTime: 2022-08-30 10:36:09
 # @Description: 
### 
function tag() {
    git pull --tags
    branch=$(git branch | sed -n '/\* /s///p')
    prefix="md"

    if [[ $branch == 'release' ]]; then
        prefix="md-pro"
    elif [[ $branch == "preview" ]]; then
        prefix="md-pre"
    fi

    new_tag=$(echo ${prefix}-$(date +'%Y%m%d')-$(git tag -l "${prefix}-$(date +'%Y%m%d')-*" | wc -l | xargs printf '%02d'))

    echo $new_tag
    git tag $new_tag
    git push origin $new_tag
}
tag
