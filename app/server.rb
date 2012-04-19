require 'sinatra'

set :public_folder, settings.root

get '/' do
  send_file 'indes.new.html'
end


