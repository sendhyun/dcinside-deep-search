function numericPostId(item) {
  if (item?.postId === undefined || item?.postId === null || item.postId === '') return null;
  const postId = Number(item.postId);
  return Number.isFinite(postId) ? postId : null;
}

function numericSearchStep(item) {
  const searchStep = Number(item?.searchStep);
  return Number.isFinite(searchStep) ? searchStep : Number.POSITIVE_INFINITY;
}

export function sortMergedResults(results = []) {
  return results
    .map((item, index) => ({ item, index, postId: numericPostId(item) }))
    .sort((left, right) => {
      if (left.postId !== null && right.postId !== null && left.postId !== right.postId) {
        return right.postId - left.postId;
      }
      if (left.postId !== null && right.postId === null) return -1;
      if (left.postId === null && right.postId !== null) return 1;

      const searchStepDiff = numericSearchStep(left.item) - numericSearchStep(right.item);
      if (searchStepDiff !== 0) return searchStepDiff;
      return left.index - right.index;
    })
    .map(({ item }) => item);
}
