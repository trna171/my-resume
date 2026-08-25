// Live UI Editor: injected Stable IDs for reliable element targeting (dev only)
// This is a Babel plugin used via Vite (@vitejs/plugin-react) or Next.js (next/babel).
import path from 'path';

function base64UrlEncode(str) {
	return Buffer.from(String(str), 'utf8')
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function toWorkspaceRelativeFile(filePath) {
	if (!filePath) return '';
	const normalizedPath = String(filePath).replace(/\\/g, '/');
	const normalizedCwd = process.cwd().replace(/\\/g, '/');
	if (normalizedPath.startsWith(normalizedCwd)) {
		return path.posix.relative(normalizedCwd, normalizedPath) || path.posix.basename(normalizedPath);
	}
	return normalizedPath;
}

export default function liveUiEditorBabelPlugin(babel) {
	const t = babel.types;
	let counter = 0;
	return {
		name: 'live-ui-editor-data-lui',
		visitor: {
			JSXOpeningElement(path, state) {
				const node = path.node;
				if (!node || !node.loc) return;
				// Skip if already tagged.
				if (node.attributes && node.attributes.some(a => a && a.type === 'JSXAttribute' && a.name && a.name.name === 'data-lui')) return;

				counter += 1;
				const file = (state && state.file && state.file.opts && state.file.opts.filename) ? String(state.file.opts.filename) : '';
				const workspaceFile = toWorkspaceRelativeFile(file);
				const payload = JSON.stringify({ f: workspaceFile, l: node.loc.start.line, c: node.loc.start.column + 1, n: counter });
				const elementId = 'lui:' + base64UrlEncode(payload);
				const attr = t.jsxAttribute(t.jsxIdentifier('data-lui'), t.stringLiteral(elementId));
				node.attributes = [attr, ...(node.attributes || [])];
			}
		}
	};
}
