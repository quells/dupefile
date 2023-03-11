import { useState } from 'preact/hooks'
import * as zip from '@zip.js/zip.js'
import './app.css'

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
    setValues(raw.split('\n').filter((v) => !!v));
  };
  const patternedValues = () => {
    return values.map((v) => pattern.replace('$v', v).replace('$f', filename));
  };

  const buildButtonEnabled = () => {
    const fileSelected = file && filename !== '';
    const valuesEntered = values.length > 0;
    return fileSelected && valuesEntered;
  };
  const handleBuild = async (ev) => {
    ev.preventDefault();
    
    let zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"), { bufferedWrite: true });
    patternedValues().forEach((pv) => {
      zipWriter.add(pv, new zip.BlobReader(file), {
        onstart: (total) => { console.log('starting', total); },
        onprogress: (idx, total) => { console.log('progress', idx, total); },
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
  };
  const downloadButtonEnabled = () => {
    return !!downloadLink;
  };
  const handleDownload = async (ev) => {
    ev.preventDefault();
    open(downloadLink, '_blank');
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
                    <br/>
                    <div style='display: flex; justify-content: space-between;'>
                      <input 
                        id='patterninput' 
                        type='text'
                        style='flex-grow: 2;'
                        value={pattern} 
                        onChange={handlePatternInput}
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
                  { patternedValues().map((v) => {
                    return (
                      <tr>
                        <td>{v}</td>
                      </tr>
                    );
                  }) }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
