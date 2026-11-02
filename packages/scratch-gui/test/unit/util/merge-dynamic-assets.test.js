import mergeDynamicAssets from '../../../src/lib/merge-dynamic-assets';

describe('mergeDynamicAssets', () => {
    const staticAssets = [{name: 'Apple'}, {name: 'Cat'}, {name: 'Dog'}];

    test('returns the static assets when there is nothing to merge or hide', () => {
        expect(mergeDynamicAssets(staticAssets, []).data).toBe(staticAssets);
    });

    test('leaves out hidden static assets', () => {
        const merged = mergeDynamicAssets(staticAssets, [], ['Cat']);
        expect(merged.data.map(item => item.name)).toEqual(['Apple', 'Dog']);
    });

    test('merges dynamic assets in with what is left, sorted by name', () => {
        const merged = mergeDynamicAssets(staticAssets, [{name: 'Boko', isPublic: true}], ['Cat']);
        expect(merged.data.map(item => item.name)).toEqual(['Apple', 'Boko', 'Dog']);
    });

    test('lets a dynamic asset take the name of a hidden static asset', () => {
        const dynamicCat = {name: 'Cat', isPublic: true};
        const merged = mergeDynamicAssets(staticAssets, [dynamicCat], ['Cat']);
        expect(merged.data).toContain(dynamicCat);
        expect(merged.data).toHaveLength(3);
    });

    test('keeps a static asset when an unhidden dynamic asset shares its name', () => {
        const merged = mergeDynamicAssets(staticAssets, [{name: 'Cat', isPublic: true}]);
        expect(merged.data).toContain(staticAssets[1]);
    });

    test('returns its inputs, so callers can tell when to merge again', () => {
        const dynamicAssets = [];
        const hiddenNames = ['Cat'];
        const merged = mergeDynamicAssets(staticAssets, dynamicAssets, hiddenNames);
        expect(merged.source).toBe(dynamicAssets);
        expect(merged.hidden).toBe(hiddenNames);
    });
});
