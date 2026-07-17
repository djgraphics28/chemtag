function e(e,t){try{let n=e.Molecule.fromMolfile(t);return n.getAllAtoms()>0?n:null}catch{return null}}function t(t,n){if(!n.includes(`
`))try{return t.Molecule.fromSmiles(n)}catch{return null}return e(t,n)??e(t,`
${n}`)}function n(e){return e.startsWith(`
`)?`ChemTag${e}`:e}export{n,t};