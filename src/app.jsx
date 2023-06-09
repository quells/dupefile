import { useState } from 'preact/hooks'
import * as zip from '@zip.js/zip.js'
import './app.css'

const uniq = (arr) => {
  let seen = {};
  let u = [];
  arr.forEach((v) => {
    if (seen[v]) return;
    seen[v] = true;
    u.push(v);
  });
  return u;
};

export function App() {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState('');
  const handleFileInput = (ev) => {
    resetDownloadLink();
    let files = ev.target.files;
    if (!files.length) return;

    let f = files[0];
    setFile(f);
    setFilename(f.name);
  };

  const defaultPattern = '$v $f';
  const [pattern, setPattern] = useState(defaultPattern);
  const handlePatternInput = (ev) => {
    resetDownloadLink();
    setPattern(ev.target.value || defaultPattern);
  };

  const [valuesRaw, setValuesRaw] = useState('');
  const [values, setValues] = useState([]);
  const handleValuesInput = (ev) => {
    let raw = ev.target.value || '';
    resetDownloadLink();
    setValuesRaw(raw);
    setValues(uniq(raw.split('\n').filter((v) => !!v)));
  };
  const patternedValues = () => {
    return values.map((v) => pattern.replace('$v', v).replace('$f', filename));
  };

  const [progress, setProgress] = useState(0);
  const buildButtonEnabled = () => {
    const fileSelected = file && filename !== '';
    const valuesEntered = values.length > 0;
    return fileSelected && valuesEntered;
  };
  const handleBuild = async (ev) => {
    ev.preventDefault();
    resetDownloadLink();

    setProgress(1);
    let zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"), { bufferedWrite: true });
    let pv = patternedValues();
    pv.forEach((pv) => {
      zipWriter.add(pv, new zip.BlobReader(file), {
        onend: () => {
          setProgress((p) => p + 1);
        },
      });
    });
    let blobURL = URL.createObjectURL(await zipWriter.close());
    setDownloadLink(blobURL);
  };

  const [downloadLink, setDownloadLink] = useState('');
  const resetDownloadLink = () => {
    if (!!downloadLink) {
      URL.revokeObjectURL(downloadLink);
    }
    setDownloadLink('');
    setProgress(0);
  };

  return (
    <>
      <div className='sleeve-outer'>
        <div className='sleeve-inner'>
          <h1>Dupe File</h1>
          <form className='pure-form pure-form-stacked'>
            <fieldset>
              <div className='pure-g'>
                <div className='pure-u-1'>
                  <label for='fileinput'>
                    Select file to duplicate:
                    <input id='fileinput' type='file' onInput={handleFileInput}></input>
                  </label>
                </div>
                <div className='pure-u-1' style='padding-top: 1em;'>
                  <label for='patterninput'>
                    Pattern
                    <br />
                    <div style='display: flex; justify-content: space-between;'>
                      <input
                        id='patterninput'
                        type='text'
                        style='flex-grow: 2;'
                        value={pattern}
                        onChange={handlePatternInput}
                        onInput={handlePatternInput}
                      />
                      <button
                        type='submit'
                        className='pure-button pure-button-primary'
                        style='margin: 0 1em;'
                        disabled={!buildButtonEnabled()}
                        onClick={handleBuild}
                      >Build</button>
                      <a
                        className={
                          (downloadLink
                            ? 'pure-button pure-button-primary'
                            : 'pure-button pure-button-primary pure-button-disabled'
                          )
                        }
                        style='padding-top: 0.75em;'
                        href={downloadLink || '#'}
                        download='dupefiles.zip'
                      >Download</a>
                    </div>
                  </label>
                </div>
              </div>
              <div className='pure-g'>
                <div className='pure-u-1'>
                  <div className='progress-bar' style={`width: ${100 * progress / (values.length+1)}%`}></div>
                </div>
              </div>
            </fieldset>
          </form>
          <div className='pure-g'>
            <div className='pure-u-1-3'>
              <textarea
                value={valuesRaw}
                onChange={handleValuesInput}
                onInput={handleValuesInput}
                placeholder='Paste Values Here'
                style='width: 95%; min-height: 200px; resize: vertical;'
              />
            </div>
            <div className='pure-u-2-3'>
              <table className='pure-table pure-table-bordered' style='width: 100%'>
                <tbody>
                  {patternedValues().map((v) => {
                    return (
                      <tr>
                        <td><pre style='margin: 0'>{v}</pre></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
