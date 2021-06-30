
const transformImportLessToCss=({types:t})=>{
    return {
        name: 'transform-import-less-to-css',
        visitor: {
            ImportDeclaration(path, source) {
                const re = /\.less$/;
                if(re.test(path.node.source.value)){
                  path.node.source.value = path.node.source.value.replace(re, '.css');
                }
            }
        }
    }
}
export default transformImportLessToCss